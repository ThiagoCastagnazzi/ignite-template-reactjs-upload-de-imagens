import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

interface FormAddImageProps {
  closeModal: () => void;
}

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations = {
    image: {
      required: 'Arquivo obrigatório',
      validate: {
        lessThan10MB: (fileList: FileList) =>
          fileList[0].size < 10 * 1024 * 1024 ||
          'O arquivo deve ser menor que 10MB',
        acceptedFormats: (fileList: FileList) =>
          /image\/(jpe?g|png|gif)/.test(fileList[0].type) ||
          'Somente são aceitos arquivos PNG, JPEG e GIF',
      },
    },
    title: {
      required: 'Título obrigatório',
      minLength: {
        value: 2,
        message: 'Mínimo de 2 caracteres',
      },
      maxLength: {
        value: 20,
        message: 'Máximo de 20 caracteres',
      },
    },
    description: {
      required: 'Descrição obrigatória',
      maxLength: {
        value: 65,
        message: 'Máximo de 65 caracteres',
      },
      minLength: {
        value: 10,
        message: 'Mínimo de 10 caracteres',
      },
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (image: { title: string; description: string; url: string }) => {
      const response = await api.post('/api/images', {
        ...image,
        url: imageUrl,
      });

      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');

        toast({
          title: 'Imagem cadastrada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        closeModal();
      },
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();
  const { errors } = formState;

  const onSubmit = async (data: Record<string, unknown>): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({
          title: 'Imagem não adicionada',
          description:
            'É preciso adicionar e aguardar o upload de uma imagem antes de realizar o cadastro.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      await mutation.mutateAsync(
        data as { title: string; description: string; url: string }
      );

      reset();
    } catch {
      toast({
        title: 'Erro ao cadastrar imagem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setImageUrl('');
      setLocalImageUrl('');
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          {...register('image', formValidations.image)}
          error={(errors.image as any)?.message}
        />

        <TextInput
          placeholder="Título da imagem..."
          type="text"
          {...register('title', formValidations.title)}
          error={(errors.title as any)?.message}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          type="text"
          {...register('description', formValidations.description)}
          error={(errors.description as any)?.message}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
